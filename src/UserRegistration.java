
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.sql.*;

import javax.swing.*;

public class UserRegistration extends JFrame implements ActionListener {

    private JLabel lblTitle, lblName, lblEmail, lblPassword;
    private JTextField txtName, txtEmail;
    private JPasswordField txtPassword;
    private JButton btnRegister, btnCancel;

    public UserRegistration() {
        setTitle("User Registration");
        setSize(400, 300);
        setLayout(new GridLayout(5, 2, 5, 5));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        lblTitle = new JLabel("User Registration", SwingConstants.CENTER);
        add(lblTitle);

        lblName = new JLabel("Name:");
        add(lblName);

        txtName = new JTextField();
        add(txtName);

        lblEmail = new JLabel("Email:");
        add(lblEmail);

        txtEmail = new JTextField();
        add(txtEmail);

        lblPassword = new JLabel("Password:");
        add(lblPassword);

        txtPassword = new JPasswordField();
        add(txtPassword);

        btnRegister = new JButton("Register");
        btnRegister.addActionListener(this);
        add(btnRegister);

        btnCancel = new JButton("Cancel");
        btnCancel.addActionListener(this);
        add(btnCancel);

        setVisible(true);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        if (e.getSource() == btnRegister) {
            String name = txtName.getText();
            String email = txtEmail.getText();
            String password = new String(txtPassword.getPassword());

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                JOptionPane.showMessageDialog(this, "Please fill in all required fields.", "Error", JOptionPane.ERROR_MESSAGE);
                return;
}
        }
    }
}